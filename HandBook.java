package com.cmb.bus.product.operation;

import java.sql.Connection;

import com.cmb.bus.resource.util.FileUtil;
import com.frm.base.exception.FrameworkException;
import com.frm.base.model.ICacheTable;
import com.frm.container.context.IContext;
import com.frm.container.operation.IOperation;
import com.frm.dao.model.imp.DBTable;

/***
 * 查询产品手册
 * 输入:产品编码
 * 
 */
public class HandBook implements IOperation {
	public static final String HandBookX1 = "HandBookX1";
	public static final String HandBookZ1 = "HandBookZ1";
	public static final String HandBookZ2 = "HandBookZ2";
	public static final String HandBookZ3 = "HandBookZ3";
	
	/**
	 * 产品简介
	 */
	public static final String CPJJ = "CPJJ";
	/**
	 * 客户金融需求及产品优势
	 */
	public static final String JRXQ = "JRXQ";
	/**
	 * 银行获益及定价
	 */
	public static final String YHHY = "YHHY";
	/**
	 * 适用对象及营销策略
	 */
	public static final String SYDX = "SYDX";
	/**
	 * 业务流程
	 */
	public static final String YWLC = "YWLC";
	/**
	 * 风险提示
	 */
	public static final String FXTS = "FXTS";
	/**
	 * 案例分析
	 */
	public static final String ALFX = "ALFX";
	/**
	 * 日常管理
	 */
	public static final String RCGL = "RCGL";
	/**
	 * 相关制度与文件
	 */
	public static final String XGZD = "XGZD";
    
	@Override
	public int execute(IContext context) throws FrameworkException {		
		
		ICacheTable input = context.getInputData().get(HandBookX1);
		if (input == null || input.getRecordCount() < 1){
			context.setErrorMessage("输入参数不存在");
			return -1;
		}
		
		String iPrdCd = input.getSqlString(0, "PRD_CD").trim();
		
		Connection conn = context.getConnection();
		
		//产品文档--通用章节
		ICacheTable z1 = new DBTable(conn, HandBookZ1, 
			"SELECT TYPE,FILE,CONTENT FROM PRD.PRODUCT_HB WHERE PRD_CD=?", iPrdCd).select();
		z1.addField("FILE_NAM");
		for (int i = 0; i < z1.getRecordCount(); i++) {
			String file = z1.getString(i, "FILE");
			String[] fileArr = file.split(";");
			String fileName = "";
			for (int oi = 0; oi < fileArr.length; oi++) {
				if (oi > 0) {
					fileName = fileName + ";";
				}
				fileName = fileName + FileUtil.getFileName(context, fileArr[oi]);
			}
			z1.update(i, "FILE_NAM", fileName);
		}		
		
		//产品文档--日常管理
		ICacheTable z2 = new DBTable(conn, HandBookZ2, 
			"SELECT REPORT_NAME,REPORT_ID,PORTAL FROM PRD.PRODUCT_HB_RCGL WHERE PRD_CD=? ORDER BY LIST_ORDER", iPrdCd).select();

		//产品文档--相关制度
		ICacheTable z3 = new DBTable(conn, HandBookZ3, 
			"SELECT FILE_NAME,FILE_ID,FILE_URL,FILE_TYPE FROM PRD.PRODUCT_HB_XGZD WHERE PRD_CD=? ORDER BY LIST_ORDER", iPrdCd).select();

		context.addOutputData(z1);
		context.addOutputData(z2);
		context.addOutputData(z3);
		
		return 0;
	}
}
