package com.cmb.bus.product.operation;

import java.sql.Connection;
import java.util.ArrayList;
import java.util.List;

import com.cmb.bus.common.util.Permission;
import com.cmb.bus.product.util.Product;
import com.cmb.bus.workflow.WFEngine;
import com.cmb.bus.workflow.entity.WFSession;
import com.cmb.bus.workflow.entity.WFSessionResult;
import com.cmb.bus.workflow.entity.WFSessionStatus;
import com.cmb.bus.workflow.entity.WFTask;
import com.cmb.bus.workflow.entity.WFTaskStatus;
import com.frm.base.exception.FrameworkException;
import com.frm.base.model.ICacheTable;
import com.frm.base.model.imp.CacheTable;
import com.frm.base.util.StringUtil;
import com.frm.container.context.IContext;
import com.frm.container.operation.IOperation;
import com.frm.dao.model.imp.DBSql;

/**
 * 产品新增管理
 * 输入：NewX1[全字段] NewX2:产品手册(简介-案例分析) NewX3:产品手册(日常管理) NewX4：产品手册(相关制度文件)
 * 输出：NewZ1 会话ID
 * 
 * @author 刘旭
 */
public class New implements IOperation {
	public static final String NewX1 = "NewX1";
	public static final String NewX2 = "NewX2";
	public static final String NewX3 = "NewX3";
	public static final String NewX4 = "NewX4";
	public static final String NewZ1 = "NewZ1";
	
	@Override
	public int execute(IContext context) throws FrameworkException {
		if (!Permission.checkPermission(context)) {
			context.setErrorMessage("没有接口权限");
			return -1;
		}
		
		//获取参数
		ICacheTable inputX1 = context.getInputData().get(NewX1);
		if(null == inputX1 || inputX1.getRecordCount()<0){
			context.setErrorMessage("输入参数不存在");
			return -1;
		}
		
		// 检查机构权限
		String brnNbr = inputX1.getString(0, "BRN_NBR");
		if (!Permission.checkPermission(StdBranchChild.StdCacheTable, context, brnNbr)) {
			context.setErrorMessage("你无权新增主管部门为" + brnNbr + "的产品");
			return -1;
		}
		
		Integer sessionId = inputX1.getInteger(0, "SESSION_ID");
		String mktFile = inputX1.getString(0, "MKT_FILE");
		String fabFile = inputX1.getString(0, "FAB_FILE");
		String otrFile = inputX1.getString(0, "OTR_FILE");
		String evdFile = inputX1.getString(0, "EVD_FILE");
		String usrId = context.getUserId();
		
		Connection conn = context.getConnection();

		//当会话ID不为空，说明为保存操作，或者驳回开始节点的修改
		if(sessionId != 0){
			WFSession wfsession = WFEngine.getSession(conn, sessionId);
			if (wfsession.getStatus() != WFSessionStatus.ongoing || wfsession.getResult() != WFSessionResult.rollback) {
				WFTask startTask = WFEngine.getStartTask(conn, sessionId);
				if (startTask.getStatus() != WFTaskStatus.ongoing) {
					context.setErrorMessage("当前会话状态不允许操作");
					return -1;
				}
			}

			if (!Permission.checkPermission(StdBranchChild.StdCacheTable, context, wfsession.getBrnNbr())) {
				context.setErrorMessage("你无权修改主管部门为" + wfsession.getBrnNbr() + "的产品");
				return -1;
			}
			wfsession.setBrnNbr(brnNbr);
		}else{
			WFSession wfsession = new WFSession();
			wfsession.setBrnNbr(brnNbr);
			wfsession.setSchemaInsId(Constant.SCHEMA_INS_ID_NEW);
			wfsession.setSponsor(context.getUserId());
			sessionId = WFEngine.createSession(conn, wfsession);
			
			WFEngine.submitSession(conn, sessionId, Constant.SCHEMA_INS_ID_NEW, null);
		}

		String sqlForInsert = 
				"INSERT INTO PRDWFL.PRODUCT_MS(" +
				"      SESSION_ID,SAP_NBR,REV_TXT,EVD_FILE,"+
				"      MAS_CD,CRG_CD,FUND_ND,PRD_NAM,UPP_PRD,PRD_LVL,PRD_STS," +
				"      BRN_NBR,ROOM,HEAD_SAP,SUB_SAP,IS_DEC,IS_HDWK,MKT_FILE," +
				"      FAB_FILE,OTR_FILE,PRD_LV1,PRD_LV2,PRD_LV3) " +
				"VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
		new DBSql(conn, "DELETE FROM PRDWFL.PRODUCT_MS WHERE SESSION_ID=?", sessionId).execute();
		new DBSql(conn, sqlForInsert, 
				sessionId, usrId, inputX1.getString(0, "REV_TXT"), evdFile,
				inputX1.getString(0, "MAS_CD"), inputX1.getString(0, "CRG_CD"), inputX1.getString(0, "FUND_ND"),
				inputX1.getString(0, "PRD_NAM"), inputX1.get(0, "UPP_PRD"), Product.LV4, Product.STS_S,
				brnNbr, inputX1.getString(0, "ROOM"), inputX1.getString(0, "HEAD_SAP"),
				inputX1.getString(0, "SUB_SAP"), inputX1.get(0, "IS_DEC"), inputX1.getString(0, "IS_HDWK"),
				mktFile, fabFile, otrFile, inputX1.getString(0, "PRD_LV1"), inputX1.getString(0, "PRD_LV2"),
				inputX1.getString(0, "PRD_LV3")).execute();
				
		//文件引用
		List<Object[]> fileAddRel = new ArrayList<Object[]>();
		if(!StringUtil.isEmpty(mktFile)){
			fileAddRel.add(new Object[]{ Product.FileRefMdlWfl, sessionId, mktFile, usrId});
		}		
		if(!StringUtil.isEmpty(fabFile)){
			fileAddRel.add(new Object[]{ Product.FileRefMdlWfl, sessionId, fabFile, usrId});
		}
		if(!StringUtil.isEmpty(otrFile)){
			String[] otrFiles = otrFile.split(";");
			for (String otr : otrFiles) {
				fileAddRel.add(new Object[] { Product.FileRefMdlWfl, sessionId, otr, usrId });
			}
		}
		if(!StringUtil.isEmpty(evdFile)){
			String[] evdFiles = evdFile.split(";");
			for (String evd : evdFiles) {
				fileAddRel.add(new Object[] { Product.FileRefMdlWfl, sessionId, evd, usrId });
			}
		}
		
		//2 产品手册通用章节
		new DBSql(conn, "DELETE FROM PRDWFL.PRODUCT_HB WHERE SESSION_ID=?", sessionId).execute();
		ICacheTable inputX2 = context.getInputData().get(NewX2);
		if (null != inputX2 && inputX2.getRecordCount() > 0) {
			List<Object[]> newX2Objs = new ArrayList<Object[]>();
			for (int i = 0; i < inputX2.getRecordCount(); i++) {
				String x2Type = inputX2.getString(i, "TYPE");
				String x2File = inputX2.getString(i, "FILE");
				String x2Content = inputX2.getString(i, "CONTENT");
				newX2Objs.add(new Object[] { sessionId, x2Type, x2File, x2Content });
				
				// 文件引用
				if (!StringUtil.isEmpty(x2File)) {
					String[] x2Files = x2File.split(";");
					for (String tmp : x2Files) {
						fileAddRel.add(new Object[] { Product.FileRefMdlWfl, sessionId, tmp, usrId });
					}
				}
			}	
			
			new DBSql(conn, "INSERT INTO PRDWFL.PRODUCT_HB(SESSION_ID,TYPE,FILE,CONTENT) VALUES(?,?,?,?)",
					newX2Objs).execute();
		}
		
		//3 产品手册日常管理
		new DBSql(conn, "DELETE FROM PRDWFL.PRODUCT_HB_RCGL WHERE SESSION_ID=?", sessionId).execute();
		ICacheTable inputX3 = context.getInputData().get(NewX3);
		if (null != inputX3 && inputX3.getRecordCount() > 0) {
			List<Object[]> newX3Objs = new ArrayList<Object[]>();
			for (int i = 0; i < inputX3.getRecordCount(); i++) {
				String x3ReportName = inputX3.getString(i, "REPORT_NAME");
				String x3ReportId = inputX3.getString(i, "REPORT_ID");
				String x3Portal = inputX3.getString(i, "PORTAL");
				Integer x3ListOrder = inputX3.getInteger(i, "LIST_ORDER");
				newX3Objs.add(new Object[] { sessionId, x3ReportName, x3ReportId, x3Portal, x3ListOrder });
			}
			new DBSql(conn, "insert into PRDWFL.PRODUCT_HB_RCGL(SESSION_ID,REPORT_NAME,REPORT_ID,PORTAL,LIST_ORDER) values(?,?,?,?,?)",
					newX3Objs).execute();
		}
		
		//4 产品手册相关制度
		new DBSql(conn, "DELETE FROM PRDWFL.PRODUCT_HB_XGZD WHERE SESSION_ID=?", sessionId).execute();
		ICacheTable inputX4 = context.getInputData().get(NewX4);
		if (null != inputX4 && inputX4.getRecordCount() > 0) {
			List<Object[]> newX4Objs = new ArrayList<Object[]>();
			for (int i = 0; i < inputX4.getRecordCount(); i++) {
				String x4FileType = inputX4.getString(i, "FILE_TYPE").trim();
				String x4FileName = inputX4.getString(i, "FILE_NAME");
				String x4FileId = inputX4.getString(i, "FILE_ID");
				String x4FileUrl = inputX4.getString(i, "FILE_URL");
				Integer x4ListOrder = inputX4.getInteger(i, "LIST_ORDER");
				newX4Objs.add(new Object[] { sessionId, x4FileType, x4FileName, x4FileId, x4FileUrl, x4ListOrder });
			}			
			new DBSql(context.getConnection(), 
					"insert into PRDWFL.PRODUCT_HB_XGZD(SESSION_ID,FILE_TYPE,FILE_NAME,FILE_ID,FILE_URL,LIST_ORDER) values(?,?,?,?,?,?)",
					newX4Objs).execute();
		}

		// 删除文件引用
		new DBSql(conn, "delete from res.fileref where ref_mdl=? and ref_nbr=?", Product.FileRefMdlWfl, sessionId).execute();
		// 插入所有文件引用
		new DBSql(conn, 
				"insert into res.fileref(ref_mdl,ref_nbr,file_id,ref_usr,ref_tim) values(?,?,?,?, current timestamp)", 
				fileAddRel).execute();
		
		//返回会话ID
		ICacheTable prdTb = new CacheTable(NewZ1, "SESSION_ID,NODE_ID,TASK_ID,BRN_NBR");
		WFTask startTask = WFEngine.getStartTask(conn, sessionId);
		prdTb.insert(sessionId, startTask.getNodeId(), startTask.getId(), brnNbr);
		context.addOutputData(prdTb);
		
		return 0;
	}

}
